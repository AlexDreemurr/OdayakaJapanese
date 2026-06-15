import React from "react";
import styled, { css } from "styled-components";
import { callDeepseek } from "../../services/ai";
import { checkGrammarItemExists, insertGrammarItem } from "../../services/grammarSets";
import Message from "../Message/Message";
import BusyMessage from "../BusyMessage/BusyMessage";
import useGrammarSets from "../../hooks/useGrammarSets";
import { FONT_FAMILY, FONT_SIZE } from "../../constants/index";
import Button from "../Button/Button";
import Select from "../Select/Select";


function GrammarContributeForm({
  fixedGrammarSetId = null,
  hideTitle = false,
  onSuccess,
}) {
  const formInputId = React.useId();
  const meaningInputId = React.useId();
  const contributorInputId = React.useId();
  const notationInputId = React.useId();
  const grammarSetSelectId = React.useId();

  const hasFixedSet = fixedGrammarSetId !== null;

  const [form, setForm] = React.useState("");
  const [meaning, setMeaning] = React.useState("");
  const [contributor, setContributor] = React.useState("");
  const [notation, setNotation] = React.useState("");
  const [status, setStatus] = React.useState("free");
  const [errorMsg, setErrorMsg] = React.useState("");

  const { grammarSets } = useGrammarSets({ scope: "joined" });
  const [selectedSetId, setSelectedSetId] = React.useState(
    hasFixedSet ? Number(fixedGrammarSetId) : null
  );

  React.useEffect(() => {
    if (hasFixedSet) {
      setSelectedSetId(Number(fixedGrammarSetId));
      return;
    }
    if (grammarSets.length > 0 && selectedSetId === null) {
      setSelectedSetId(grammarSets[0].id);
    }
  }, [fixedGrammarSetId, hasFixedSet, grammarSets, selectedSetId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("busy");
    setErrorMsg("");

    const normalizedForm = form.trim();
    const normalizedMeaning = meaning.trim();
    const normalizedContributor = contributor.trim();
    const normalizedNotation = notation.trim();

    // 查重
    const { data: existing, error: queryError } = await checkGrammarItemExists(
      normalizedForm,
      selectedSetId
    );

    if (queryError) {
      setStatus("error");
      setErrorMsg(queryError.message);
      return;
    }

    if (existing) {
      setStatus("error");
      setErrorMsg(`「${normalizedForm}」已经存在于该语法集中`);
      return;
    }

    // 调用 AI 生成例句
    let result;
    try {
      result = await callDeepseek(
        `语法形式：${normalizedForm}，含义：${normalizedMeaning}，贡献者：${normalizedContributor}，备注：${normalizedNotation}，set_id：${selectedSetId}`,
        `你是一个日语语法助手。用户会给你一个日语语法形式（如〜ことにする）和可选的含义、贡献者、备注、set_id。
首先判断输入的语法形式是否真实存在于日语中。如果不是，只返回：{"valid": false}
如果是，返回以下格式的JSON对象，不要有任何多余的文字和markdown格式，只返回纯JSON。

要求：
1. sentences数组包含5个元素：
   - 前4个（索引0-3）是做题例句，难度从易到难逐渐递增，长度在50到120字之间。每句只准出现一次该语法形式（或其活用形），把语法形式用大括号标注，例如「彼女は留学{することにした}。」。
   - 第5个（索引4）是展示用例句对象，包含 text（自然流畅的示范句，不含大括号，30-80字）和 translation（对应的中文翻译）。
2. 如果用户已提供含义（非空），请原样使用；否则生成简洁的中文含义。
3. 如果用户提供了备注，请优先按备注要求生成。

格式：
{
  "valid": true,
  "form": "用户输入的原始语法形式",
  "meaning": "中文含义",
  "sentences": ["做题例句1", "做题例句2", "做题例句3", "做题例句4", { "text": "展示例句", "translation": "中文翻译" }],
  "set_id": 12
}`,
        "generate"
      );
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message ?? "AI 调用失败，请稍后重试");
      return;
    }

    let grammarData;
    try {
      grammarData = JSON.parse(result);
    } catch {
      setStatus("error");
      setErrorMsg("AI 返回格式错误，请重试");
      return;
    }

    if (!grammarData.valid) {
      setStatus("error");
      setErrorMsg(`「${normalizedForm}」不是一个有效的日语语法形式`);
      return;
    }

    const { error } = await insertGrammarItem({
      set_id: selectedSetId,
      form: grammarData.form ?? normalizedForm,
      meaning: grammarData.meaning || null,
      sentences: grammarData.sentences ?? [],
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("success");
    setForm("");
    setMeaning("");
    setNotation("");
    onSuccess?.();
  }

  return (
    <Wrapper onSubmit={handleSubmit}>
      {!hideTitle && <TitleWrapper>加语法</TitleWrapper>}

      {status !== "free" && (
        <StatusWrapper>
          {status === "busy" && (
            <BusyMessage fontSize={FONT_SIZE.default}>AI 生成中…</BusyMessage>
          )}
          {status === "error" && (
            <Message fontSize={FONT_SIZE.default} type="error">
              发生错误: {errorMsg}
            </Message>
          )}
          {status === "success" && (
            <Message fontSize={FONT_SIZE.default} type="success">
              提交成功！
            </Message>
          )}
        </StatusWrapper>
      )}

      <FormElementWrapper>
        <RowWrapper>
          <LabelWrapper htmlFor={formInputId}>语法形式</LabelWrapper>
          <InputWrapper
            id={formInputId}
            placeholder="〜ことにする"
            value={form}
            onChange={(e) => setForm(e.target.value)}
            required
            disabled={status === "busy"}
          />
        </RowWrapper>

        <RowWrapper>
          <LabelWrapper htmlFor={meaningInputId}>含义</LabelWrapper>
          <InputWrapper
            id={meaningInputId}
            placeholder="决定做某事（留空则由 AI 生成）"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            disabled={status === "busy"}
          />
        </RowWrapper>

        <RowWrapper>
          <LabelWrapper htmlFor={contributorInputId}>贡献者</LabelWrapper>
          <InputWrapper
            id={contributorInputId}
            placeholder="〇〇さん"
            value={contributor}
            onChange={(e) => setContributor(e.target.value)}
            disabled={status === "busy"}
          />
        </RowWrapper>

        <RowWrapper>
          <LabelWrapper htmlFor={notationInputId}>备注</LabelWrapper>
          <TextareaWrapper
            id={notationInputId}
            placeholder="例：侧重书面语用法"
            value={notation}
            onChange={(e) => setNotation(e.target.value)}
            disabled={status === "busy"}
          />
        </RowWrapper>

        {!hasFixedSet && selectedSetId !== null && grammarSets.length > 0 && (
          <RowWrapper data-required>
            <LabelWrapper htmlFor={grammarSetSelectId}>语法集</LabelWrapper>
            <Select
              disabled={status === "busy"}
              id={grammarSetSelectId}
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(Number(e.target.value))}
            >
              {grammarSets.map((gs) => (
                <option key={gs.id} value={gs.id}>
                  {gs.name}
                </option>
              ))}
            </Select>
          </RowWrapper>
        )}
      </FormElementWrapper>

      <SubmitRow>
        <Button
          disabled={
            status === "busy" ||
            selectedSetId === null ||
            (!hasFixedSet && grammarSets.length <= 0)
          }
        >
          提交
        </Button>
      </SubmitRow>
    </Wrapper>
  );
}

/* ── styles（与 ContributeForm 保持一致）── */
const Wrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  width: 100%;
`;
const TitleWrapper = styled.h1`
  text-align: center;
  font-size: ${FONT_SIZE.giant};
`;
const LabelWrapper = styled.label`
  font-size: ${FONT_SIZE.default};
  width: 70px;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  &::after {
    content: " *";
    font-size: 2rem;
    font-family: ${FONT_FAMILY.english_primary};
    visibility: hidden;
    line-height: 1.5;
  }
`;
const RowWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  min-width: 0;
  &:has(input:required) ${LabelWrapper}::after,
  &[data-required] ${LabelWrapper}::after {
    color: red;
    visibility: visible;
  }
`;
const FormElementWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 1.5rem 0 1rem;
`;
const autofillStyles = css`
  &:-webkit-autofill:not(:disabled),
  &:-webkit-autofill:hover:not(:disabled),
  &:-webkit-autofill:focus:not(:disabled),
  &:-webkit-autofill:active:not(:disabled) {
    border: 1px var(--gray40) solid;
    border-radius: 2px;
    -webkit-box-shadow: 0 0 0 1000px Field inset;
    -webkit-text-fill-color: FieldText;
    caret-color: FieldText;
    transition: background-color 9999s ease-in-out 0s;
  }
  &:-webkit-autofill:disabled {
    border: 1px var(--gray85) solid;
    border-radius: 2px;
    -webkit-box-shadow: 0 0 0 1000px ButtonFace inset;
    -webkit-text-fill-color: GrayText;
    caret-color: GrayText;
    transition: background-color 9999s ease-in-out 0s;
  }
`;
const fieldStyles = css`
  font-size: ${FONT_SIZE.default};
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex: 1 1 0;
  padding: 0.45rem 0.7rem;
  color: var(--text);
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
  &::placeholder {
    color: var(--gray60);
  }
  &:hover:not(:disabled) {
    border-color: var(--gray60);
  }
  &:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-soft);
  }
  &:disabled {
    background-color: var(--gray95);
    color: var(--text-muted);
  }
`;
const InputWrapper = styled.input`
  ${fieldStyles}
  ${autofillStyles}
`;
const TextareaWrapper = styled.textarea`
  ${fieldStyles}
  resize: vertical;
  min-height: 2.4rem;
  ${autofillStyles}
`;
const StatusWrapper = styled.div`
  width: 100%;
  padding: 0 1rem;
  margin-bottom: -1rem;
  font-size: ${FONT_SIZE.default};
`;
const SubmitRow = styled.div`
  padding: 0 1rem;
`;

export default GrammarContributeForm;
